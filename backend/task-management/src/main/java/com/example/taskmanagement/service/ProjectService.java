package com.example.taskmanagement.service;

import com.example.taskmanagement.entity.Project;
import com.example.taskmanagement.entity.User;
import com.example.taskmanagement.repository.ProjectRepository;
import com.example.taskmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * プロジェクトのサービスクラス
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    /**
     * プロジェクトリポジトリ
     */
    private final ProjectRepository projectRepository;

    /**
     * ユーザリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * プロジェクトを作成する
     * 
     * @param name        プロジェクト名
     * @param description 説明
     * @param ownerId     オーナーID
     * @return 作成されたプロジェクト
     */
    @Transactional
    public Project createProject(String name, String description, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found: " + ownerId));

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);

        return projectRepository.save(project);
    }

    /**
     * オーナーIDでプロジェクトを取得する
     * 
     * @param ownerId オーナーID
     * @return プロジェクトのリスト
     */
    @Transactional(readOnly = true)
    public List<Project> getProjectsByOwnerId(Long ownerId) {
        return projectRepository.findByOwnerId(ownerId);
    }

    /**
     * IDでプロジェクトを取得する
     * 
     * @param id プロジェクトID
     * @return プロジェクト
     */
    @Transactional(readOnly = true)
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }
}
